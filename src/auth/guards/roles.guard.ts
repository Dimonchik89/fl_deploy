import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		// извлекаем роли из созданного нами декоратора
		const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
			context.getHandler(), // если на конкретном роуте проверка роли
			context.getClass(), // если на всем контроллере висит проверка роли
		]);
		const user = context.switchToHttp().getRequest().user;

		const hasRequiredRole = requiredRoles.some((role) => user.role === role);
		return hasRequiredRole;
	}
}
